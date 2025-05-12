export async function sendTelegramMessage(message: any) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const payload = {
    chat_id: process.env.CHANNEL_CHAT_ID,
    text: message,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("Message sent:", data);
  } catch (error) {
    console.error("Error sending message:", error);
  }
}
