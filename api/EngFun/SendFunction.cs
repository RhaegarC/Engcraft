using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Azure.Data.Tables;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using WebPush;

namespace EngFun
{
    // Broadcasts a {title, body} notification to every stored push subscription
    // using the Web Push protocol (VAPID-signed). Protected by the Function host
    // key — there is no user-facing send UI; teachers/scripts call it directly.
    public class SendFunction
    {
        private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };
        private readonly ILogger _logger;

        public SendFunction(ILoggerFactory loggerFactory)
            => _logger = loggerFactory.CreateLogger<SendFunction>();

        public class MessageDto
        {
            public string title { get; set; } = "Egnlish Craft";
            public string body { get; set; } = "Time to practice your pronouns! 🎯";
        }

        [Function("Send")]
        public async Task<HttpResponseData> Run(
            [HttpTrigger(AuthorizationLevel.Function, "post")] HttpRequestData req)
        {
            var message = new MessageDto();
            var raw = await new StreamReader(req.Body).ReadToEndAsync();
            if (!string.IsNullOrWhiteSpace(raw))
            {
                try { message = JsonSerializer.Deserialize<MessageDto>(raw, JsonOpts) ?? message; }
                catch { _logger.LogWarning("Ignoring malformed send payload: {raw}", raw); }
            }

            var subject = Environment.GetEnvironmentVariable("VAPID_SUBJECT");
            var publicKey = Environment.GetEnvironmentVariable("VAPID_PUBLIC_KEY");
            var privateKey = Environment.GetEnvironmentVariable("VAPID_PRIVATE_KEY");
            if (string.IsNullOrEmpty(subject) || string.IsNullOrEmpty(publicKey) || string.IsNullOrEmpty(privateKey))
            {
                return Text(req, HttpStatusCode.InternalServerError,
                    "VAPID_SUBJECT / VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY app settings are not configured");
            }

            var vapid = new VapidDetails(subject, publicKey, privateKey);
            var client = new WebPushClient();
            var payload = JsonSerializer.Serialize(message);

            var table = PushTable.Client();
            var sent = 0;
            var failed = new List<object>();
            // AsyncPageable pages internally, so this covers every stored row.
            await foreach (var entity in table.QueryAsync<PushEntity>(
                filter: TableClient.CreateQueryFilter<PushEntity>(e => e.PartitionKey == PushTable.PartitionKey)))
            {
                var subscription = new PushSubscription(entity.endpoint, entity.p256dh, entity.auth);
                try
                {
                    await client.SendNotificationAsync(subscription, payload, vapid);
                    sent++;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Push failed for {rowKey}", entity.RowKey);
                    failed.Add(new { endpointHash = entity.RowKey, error = ex.Message });
                }
            }

            _logger.LogInformation("Sent {sent} notification(s), {failed} failed", sent, failed.Count);
            var res = req.CreateResponse(HttpStatusCode.OK);
            await res.WriteStringAsync(JsonSerializer.Serialize(new { sent, failed }), Encoding.UTF8);
            return res;
        }

        private static HttpResponseData Text(HttpRequestData req, HttpStatusCode code, string body)
        {
            var res = req.CreateResponse(code);
            res.WriteString(body);
            return res;
        }
    }
}
