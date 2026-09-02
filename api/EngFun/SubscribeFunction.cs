using System;
using System.IO;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Azure.Data.Tables;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;

namespace EngFun
{
    // Registers a browser push subscription (POSTed by the PWA after the user
    // opts in) into the PushSubscriptions table. Idempotent: re-subscribing the
    // same endpoint updates the existing row (200) instead of adding one (201).
    public class SubscribeFunction
    {
        private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };
        private readonly ILogger _logger;

        public SubscribeFunction(ILoggerFactory loggerFactory)
            => _logger = loggerFactory.CreateLogger<SubscribeFunction>();

        // Payload sent by site/push.js after pushManager.subscribe().
        public class PushSubscriptionDto
        {
            public string endpoint { get; set; }
            public PushKeys keys { get; set; }
        }

        public class PushKeys
        {
            public string p256dh { get; set; }
            public string auth { get; set; }
        }

        [Function("Subscribe")]
        public async Task<HttpResponseData> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post")] HttpRequestData req)
        {
            PushSubscriptionDto dto;
            try
            {
                dto = JsonSerializer.Deserialize<PushSubscriptionDto>(
                    await new StreamReader(req.Body).ReadToEndAsync(), JsonOpts);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Malformed subscribe payload");
                return Text(req, HttpStatusCode.BadRequest, "Invalid JSON body");
            }

            if (dto == null || string.IsNullOrWhiteSpace(dto.endpoint)
                || string.IsNullOrWhiteSpace(dto.keys?.p256dh)
                || string.IsNullOrWhiteSpace(dto.keys?.auth))
            {
                return Text(req, HttpStatusCode.BadRequest,
                    "endpoint, keys.p256dh and keys.auth are required");
            }

            var entity = new PushEntity
            {
                PartitionKey = PushTable.PartitionKey,
                RowKey = PushTable.RowKeyFor(dto.endpoint),
                endpoint = dto.endpoint,
                p256dh = dto.keys.p256dh,
                auth = dto.keys.auth,
                CreatedAt = DateTime.UtcNow.ToString("o"),
            };

            var table = PushTable.Client();
            var existing = await table.GetEntityIfExistsAsync<PushEntity>(entity.PartitionKey, entity.RowKey);
            if (existing.HasValue)
            {
                entity.ETag = existing.Value.ETag;
                await table.UpdateEntityAsync(entity, existing.Value.ETag, TableUpdateMode.Replace);
                _logger.LogInformation("Subscription updated ({rowKey})", entity.RowKey);
                return Text(req, HttpStatusCode.OK, "updated");
            }

            await table.AddEntityAsync(entity);
            _logger.LogInformation("Subscription added ({rowKey})", entity.RowKey);
            return Text(req, HttpStatusCode.Created, "created");
        }

        private static HttpResponseData Text(HttpRequestData req, HttpStatusCode code, string body)
        {
            var res = req.CreateResponse(code);
            res.WriteString(body);
            return res;
        }
    }
}
