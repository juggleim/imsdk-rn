require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "im-rn-sdk"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = "https://github.com/juggleim/im-rn-sdk"
  s.license      = "MIT"
  s.authors      = { "Juggle IM" => "support@juggleim.com" }
  s.platforms    = { :ios => "9.0" }
  s.source       = { :git => "https://github.com/juggleim/im-rn-sdk.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm}"
  s.requires_arc = true

  s.dependency "React-Core"
  s.dependency "JuggleIM", "~> 1.8.29"
end