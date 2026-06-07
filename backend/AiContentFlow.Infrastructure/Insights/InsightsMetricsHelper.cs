namespace AiContentFlow.Infrastructure.Insights;

internal static class InsightsMetricsHelper
{
    public static decimal CalculateEngagementRate(int impressions, int clicks, int shares, int likes = 0, int comments = 0)
    {
        if (impressions <= 0)
        {
            var interactions = clicks + shares + likes + comments;
            return interactions > 0 ? 100m : 0m;
        }

        var engaged = clicks + shares + likes + comments;
        return Math.Round((decimal)engaged / impressions * 100m, 2);
    }
}
