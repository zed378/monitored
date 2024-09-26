const { IncomingWebhook } = require("ms-teams-webhook");
const axios = require("axios");

const url =
  "https://bodhadharmaja.webhook.office.com/webhookb2/b545888c-37bd-4303-b44f-815d35a8d3f1@65b908be-db42-4118-8a9e-dfaa849664c9/IncomingWebhook/8fecf7762cfd46118ae8f168bc8aac86/13b569d5-4c60-4979-8cf5-6f09256b5aa2";

const webhook = new IncomingWebhook(url);

async function getDockerStats() {
  try {
    const response = await axios.get("http://localhost:6789/docker/containers");

    const exitedContainers = response.data.data.data.exited
      ? response.data.data.data.exited.containers
      : "no data";

    exitedContainers !== "no data" &&
      exitedContainers.forEach(async (container) => {
        const message = {
          "@type": "MessageCard",
          "@context": "https://schema.org/extensions",
          summary: `Container ${container.name} has exited`,
          themeColor: "FF0000",
          title: `Exited container: ${container.name}`,
          sections: [
            {
              activityTitle: `Container ID: ${container.id}`,
              activitySubtitle: `Image: ${container.image}`,
              text: `The container ${container.name} using image ${container.image} has exited.`,
            },
          ],
        };

        await webhook.send(message);
        console.log(`Sent webhook for exited container: ${container.name}`);
      });
  } catch (error) {
    console.error(
      "Error fetching Docker stats or sending webhook:",
      error.message
    );
  }
}

// Run the function to get Docker stats and send webhooks
getDockerStats();
