# Rozszerzenie SketchUp: Forma Zieleni. Skopiuj ten plik i katalog forma_zieleni do Plugins.
require 'sketchup.rb'
require 'extensions.rb'

module FormaZieleni
  EXT = SketchupExtension.new('Forma Zieleni', File.join(File.dirname(__FILE__), 'forma_zieleni', 'main'))
  EXT.description = 'Zestawienie roślin, eksport scen i wysyłka plików do portalu klienta.'
  EXT.version = '0.1.0'
  EXT.creator = 'Forma Zieleni'
  Sketchup.register_extension(EXT, true)
end
