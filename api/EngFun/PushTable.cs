using System;
using System.Security.Cryptography;
using System.Text;
using Azure.Data.Tables;

namespace EngFun
{
    // Shared access to the push-subscription table. The connection string is
    // supplied at runtime via the "PushStorage" app setting (account key or SAS
    // for the learnstor storage account) and never committed to the repo.
    public static class PushTable
    {
        public const string PartitionKey = "push";

        public static TableClient Client()
        {
            var connection = Environment.GetEnvironmentVariable("PushStorage")
                ?? throw new InvalidOperationException(
                    "PushStorage app setting is missing — set it to the learnstor connection string.");
            var tableName = Environment.GetEnvironmentVariable("TABLE_NAME") ?? "PushSubscriptions";
            var table = new TableServiceClient(connection).GetTableClient(tableName);
            table.CreateIfNotExists();
            return table;
        }

        // Same endpoint always maps to the same RowKey, so re-subscribes are
        // idempotent upserts rather than accumulating duplicate rows.
        public static string RowKeyFor(string endpoint)
        {
            using var sha = SHA256.Create();
            return Convert.ToHexString(sha.ComputeHash(Encoding.UTF8.GetBytes(endpoint))).ToLowerInvariant();
        }
    }
}
