using Microsoft.AspNetCore.Mvc;

namespace MadK.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class PingController : ControllerBase
{
    [HttpGet]
    public IActionResult Ping()
    {
        return Ok(new
        {
            status = "Healthy",
            message = "MadK Store API is running",
            timestamp = DateTime.UtcNow
        });
    }
}
