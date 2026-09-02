using System;
using Azure;
using Azure.Data.Tables;

namespace EngFun
{
    // One Web Push subscription, stored in the PushSubscriptions table
    // (learnstor storage account). PartitionKey = "push"; RowKey = SHA256 of
    // the endpoint (endpoint URLs contain '/', which is not allowed in RowKey).
    public class PushEntity : ITableEntity
    {
        public string PartitionKey { get; set; }
        public string RowKey { get; set; }
        public string endpoint { get; set; }
        public string p256dh { get; set; }
        public string auth { get; set; }
        public string CreatedAt { get; set; }
        public DateTimeOffset? Timestamp { get; set; }
        public ETag ETag { get; set; }
    }
}
