import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser


class GroupChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        self.group_id = str(self.scope['url_route']['kwargs']['group_id'])
        self.room_group_name = f'chat_{self.group_id}'

        if isinstance(self.user, AnonymousUser):
            await self.close(code=4001)
            return

        is_member = await self._is_member()
        if not is_member:
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        body = data.get('body', '').strip()
        if not body:
            return

        message = await self._save_message(body)

        await self.channel_layer.group_send(self.room_group_name, {
            'type': 'chat_message',
            'message': {
                'id': str(message.id),
                'body': body,
                'sender_id': str(self.user.id),
                'sender_name': self._display_name(self.user),
                'is_teacher': self.user.role == 'teacher' and self.user.is_teacher_verified,
                'created_at': message.created_at.isoformat(),
            }
        })

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event['message']))

    @staticmethod
    def _display_name(user):
        return f'{user.first_name} {user.last_name[0]}.' if user.last_name else user.first_name

    @database_sync_to_async
    def _is_member(self):
        from .models import CommunityMembership
        return CommunityMembership.objects.filter(group_id=self.group_id, user=self.user).exists()

    @database_sync_to_async
    def _save_message(self, body):
        from .models import ChatMessage
        return ChatMessage.objects.create(group_id=self.group_id, sender=self.user, body=body)
