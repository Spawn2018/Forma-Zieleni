# Typed-by-contract Ruby client for SketchUp. Keep DTO keys aligned with contracts/openapi.yaml.
require 'json'; require 'net/http'; require 'uri'
module FormaZieleniApi
 class Client
  def initialize(base_url:, token:); @base=base_url.sub(%r{/$},''); @token=token; end
  def project(id); request(:get, "/projects/#{URI.encode_www_form_component(id)}"); end
  def create_upload_intent(filename:, content_type:, size_bytes:, project_id:, kind: 'render', visibility: 'client', idempotency_key:)
   request(:post,'/files/upload-intents', body:{filename:filename,content_type:content_type,size_bytes:size_bytes,project_id:project_id,kind:kind,visibility:visibility}, idempotency_key:idempotency_key)
  end
  private
  def request(method,path,body:nil,idempotency_key:nil)
   uri=URI.parse(@base+path); klass=method==:post ? Net::HTTP::Post : Net::HTTP::Get; req=klass.new(uri); req['Authorization']="Bearer #{@token}"; req['Accept']='application/json'; req['Content-Type']='application/json' if body; req['Idempotency-Key']=idempotency_key if idempotency_key; req.body=JSON.dump(body) if body; res=Net::HTTP.start(uri.hostname,uri.port,use_ssl:uri.scheme=='https'){|h|h.request(req)}; parsed=res.body.to_s.empty? ? {} : JSON.parse(res.body); raise "API #{res.code}: #{parsed['message'] || res.message}" unless res.code.to_i.between?(200,299); parsed
  end
 end
end
