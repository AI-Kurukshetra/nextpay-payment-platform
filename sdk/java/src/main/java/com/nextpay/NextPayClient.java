package com.payforge;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class PayForgeClient {
  private final String apiKey;
  private final String baseUrl;
  private final HttpClient client;

  public PayForgeClient(String apiKey, String baseUrl) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    this.client = HttpClient.newHttpClient();
  }

  public String createPayment(String payloadJson) throws IOException, InterruptedException {
    HttpRequest req = HttpRequest.newBuilder(URI.create(baseUrl + "/payments"))
      .header("content-type", "application/json")
      .header("x-api-key", apiKey)
      .POST(HttpRequest.BodyPublishers.ofString(payloadJson))
      .build();

    HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
    if (res.statusCode() >= 400) {
      throw new RuntimeException("payforge_request_failed");
    }
    return res.body();
  }
}
