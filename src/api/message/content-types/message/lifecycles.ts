import Pusher from 'pusher';

// Initialize Pusher using environment variables
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || "",       
  key: process.env.PUSHER_KEY || "",           
  secret: process.env.PUSHER_SECRET || "",     
  cluster: process.env.PUSHER_CLUSTER || "eu",   
  useTLS: true
});

export default {
  async afterCreate(event: any) {
    const { result } = event;
    
    try {
      await pusher.trigger(`staff-${result.receiverId}`, 'new-message', {
        id: result.id, // <-- CRITICAL: Include the ID
        text: result.text,
        senderId: result.senderId,
        receiverId: result.receiverId,
      });
    } catch (error) {
      console.error("Pusher trigger failed:", error);
    }
  },
};