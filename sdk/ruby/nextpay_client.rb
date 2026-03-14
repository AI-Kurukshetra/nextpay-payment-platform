require 'net/http'
require 'json'

class PayForgeClient
  def initialize(api_key, base_url = 'https://api.payforge.local/api/v1')
    @api_key = api_key
    @base_url = base_url.sub(/\/$/, '')
  end

  def create_payment(amount:, currency:, metadata: {})
    request('POST', '/payments', { amount: amount, currency: currency, metadata: metadata })
  end

  private

  def request(method, path, payload = nil)
    uri = URI("#{@base_url}#{path}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = uri.scheme == 'https'
    req = Net::HTTP::Post.new(uri)
    req['content-type'] = 'application/json'
    req['x-api-key'] = @api_key
    req.body = payload.to_json if payload

    res = http.request(req)
    raise "payforge_request_failed" unless res.code.to_i < 400

    JSON.parse(res.body)
  end
end
