import MailerLite from "@mailerlite/mailerlite-nodejs";

function getClient() {
  const apiKey = process.env.MAILERLITE_API_KEY;
  if (!apiKey) {
    throw new Error("MAILERLITE_API_KEY is not configured");
  }
  return new MailerLite({ api_key: apiKey });
}

export async function addSubscriber(email: string, fields?: Record<string, string>) {
  const client = getClient();
  await client.subscribers.createOrUpdate({
    email,
    ...(fields && { fields }),
  });
}

export async function removeSubscriber(email: string) {
  const client = getClient();
  try {
    const subscriber = await client.subscribers.find(email);
    if (subscriber?.data?.data?.id) {
      await client.subscribers.delete(subscriber.data.data.id);
    }
  } catch (error) {
    console.error("Failed to remove subscriber:", error);
  }
}

export async function addToGroup(email: string, groupId: string) {
  const client = getClient();
  try {
    await client.groups.assignSubscriber(groupId, email);
  } catch (error) {
    console.error(`Failed to add ${email} to group ${groupId}:`, error);
  }
}

export async function removeFromGroup(email: string, groupId: string) {
  const client = getClient();
  try {
    await client.groups.unAssignSubscriber(groupId, email);
  } catch (error) {
    console.error(`Failed to remove ${email} from group ${groupId}:`, error);
  }
}
