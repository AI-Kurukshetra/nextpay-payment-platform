using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace PayForge {
  public class PayForgeClient {
    private readonly HttpClient _http;

    public PayForgeClient(string apiKey, string baseUrl = "https://api.payforge.local/api/v1") {
      _http = new HttpClient();
      _http.BaseAddress = new System.Uri(baseUrl.TrimEnd('/'));
      _http.DefaultRequestHeaders.Add("x-api-key", apiKey);
    }

    public async Task<string> CreatePaymentAsync(string payloadJson) {
      var content = new StringContent(payloadJson, Encoding.UTF8, "application/json");
      var response = await _http.PostAsync("/payments", content);
      response.EnsureSuccessStatusCode();
      return await response.Content.ReadAsStringAsync();
    }
  }
}
