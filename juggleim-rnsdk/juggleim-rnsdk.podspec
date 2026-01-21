require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "juggleim-rnsdk"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = "https://github.com/juggleim/imsdk-rn"
  s.license      = "MIT"
  s.authors      = { "Juggle IM" => "support@juggleim.com" }
  s.platforms    = { :ios => "9.0" }
  s.source       = { :git => "https://github.com/juggleim/imsdk-rn.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm}"
  s.requires_arc = true

  s.dependency "React-Core"
  s.dependency "JuggleIM", "~> 1.8.37"
  s.dependency 'JZegoCall', '1.8.25'

end