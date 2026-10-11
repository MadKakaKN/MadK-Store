using MadK.Domain.Entities;

namespace MadK.Application.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateAccessToken(User user, IEnumerable<string> roles, IEnumerable<string> permissions);
    RefreshToken GenerateRefreshToken(Guid userId);
    int GetAccessTokenExpirySeconds();
}
