using System.Text;
using System.Xml.Linq;
using MadK.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MadK.API.Controllers;

[ApiController]
public class SitemapController : ControllerBase
{
    private static readonly XNamespace Ns = "http://www.sitemaps.org/schemas/sitemap/0.9";
    private readonly IAppDbContext _dbContext;
    private readonly IConfiguration _configuration;

    public SitemapController(IAppDbContext dbContext, IConfiguration configuration)
    {
        _dbContext = dbContext;
        _configuration = configuration;
    }

    /// <summary>
    /// Tự động sinh file sitemap.xml chuẩn SEO chứa danh sách toàn bộ URL công khai:
    /// Trang chủ, danh mục sản phẩm, chi tiết sản phẩm và các trang chính sách.
    /// </summary>
    [HttpGet]
    [Route("sitemap.xml")]
    [Route("api/v1/sitemap.xml")]
    [Produces("application/xml")]
    public async Task<IActionResult> GetSitemap(CancellationToken ct)
    {
        var siteUrl = (_configuration["AppSettings:SiteUrl"] ?? $"{Request.Scheme}://{Request.Host}")
            .TrimEnd('/');

        var urls = new List<XElement>();

        // 1. Homepage
        urls.Add(CreateUrlElement(
            $"{siteUrl}/",
            DateTime.UtcNow,
            "daily",
            "1.0"));

        // 2. Policy Pages
        var policyPages = new[]
        {
            "policies/warranty",
            "policies/returns",
            "policies/shipping",
            "policies/privacy"
        };

        foreach (var policy in policyPages)
        {
            urls.Add(CreateUrlElement(
                $"{siteUrl}/{policy}",
                DateTime.UtcNow,
                "monthly",
                "0.5"));
        }

        // 3. Categories (Active & Non-deleted)
        var categories = await _dbContext.Categories
            .AsNoTracking()
            .Where(c => c.IsActive && !c.IsDeleted)
            .OrderBy(c => c.DisplayOrder)
            .Select(c => new
            {
                c.Slug,
                LastModified = c.UpdatedAt ?? c.CreatedAt
            })
            .ToListAsync(ct);

        foreach (var cat in categories)
        {
            urls.Add(CreateUrlElement(
                $"{siteUrl}/categories/{cat.Slug}",
                cat.LastModified,
                "daily",
                "0.8"));
        }

        // 4. Products (Active & Non-deleted)
        var products = await _dbContext.Products
            .AsNoTracking()
            .Where(p => p.IsActive && !p.IsDeleted)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.Slug,
                LastModified = p.UpdatedAt ?? p.CreatedAt
            })
            .ToListAsync(ct);

        foreach (var prod in products)
        {
            urls.Add(CreateUrlElement(
                $"{siteUrl}/products/{prod.Slug}",
                prod.LastModified,
                "weekly",
                "0.9"));
        }

        var sitemapDoc = new XDocument(
            new XDeclaration("1.0", "utf-8", "yes"),
            new XElement(Ns + "urlset", urls)
        );

        var xmlString = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" + sitemapDoc.ToString();
        return Content(xmlString, "application/xml", Encoding.UTF8);
    }

    private static XElement CreateUrlElement(string location, DateTime lastModified, string changeFrequency, string priority)
    {
        return new XElement(Ns + "url",
            new XElement(Ns + "loc", location),
            new XElement(Ns + "lastmod", lastModified.ToString("yyyy-MM-dd")),
            new XElement(Ns + "changefreq", changeFrequency),
            new XElement(Ns + "priority", priority)
        );
    }
}
