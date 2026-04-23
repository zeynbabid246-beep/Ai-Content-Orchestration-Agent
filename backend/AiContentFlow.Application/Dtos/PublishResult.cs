namespace Application.DTOs
{
    public class PublishResult
    {
        public bool IsSuccess { get; set; }
        public string? PostId { get; set; }
        public string? PostUrl { get; set; }
        public string? ErrorMessage { get; set; }

        public static PublishResult Success(string postId, string postUrl) =>
            new() { IsSuccess = true, PostId = postId, PostUrl = postUrl };

        public static PublishResult Failure(string error) =>
            new() { IsSuccess = false, ErrorMessage = error };
    }
}