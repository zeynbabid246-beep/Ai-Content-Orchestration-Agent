using AiContentFlow.Domain.Models;

namespace AiContentFlow.Application.Common.Authorization;

public static class TeamAuthorization
{
    public static void EnsureMember(UserTeam? membership, string message = "Not a team member")
    {
        if (membership is null)
            throw new UnauthorizedAccessException(message);
    }

    public static void EnsureCanMutateContent(UserTeam membership, string message = "Only Admin or Editor can perform this action")
    {
        if (membership.Role is not TeamRole.Admin and not TeamRole.Editor)
            throw new UnauthorizedAccessException(message);
    }

    public static void EnsureCanManageChannels(UserTeam membership, string message = "Only Admin or Editor can manage channels")
    {
        EnsureCanMutateContent(membership, message);
    }

    public static void EnsureAdmin(UserTeam membership, string message = "Only Admin can perform this action")
    {
        if (membership.Role != TeamRole.Admin)
            throw new UnauthorizedAccessException(message);
    }
}
