-- Add UPDATE policy for messages to allow marking as read
CREATE POLICY "Users can update messages in own conversations" ON public.messages
  FOR UPDATE USING (
    conversation_id IN (SELECT conversation_id FROM public.conversation_members WHERE user_id = auth.uid())
  );
