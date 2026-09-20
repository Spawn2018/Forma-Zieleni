# Trzy polecenia: zestawienie roślin do CSV, eksport scen do JPG, wysyłka plików do portalu.
# Wymagania modelu (docs/18-SKETCHUP-CLAUDE.md §2):
#   komponent rośliny ma atrybuty w słowniku 'fz': plant_latin, plant_pl, opcjonalnie spacing_cm
#   sceny nazwane wg schematu: 01_wejscie, 02_taras, ...
require 'sketchup.rb'
require 'json'
require 'net/http'
require 'uri'

module FormaZieleni
  DICT = 'fz'.freeze
  CONFIG_FILE = File.join(Sketchup.find_support_file('Plugins'), 'forma_zieleni_config.json').freeze

  module_function

  def config
    return @config if @config
    @config = File.exist?(CONFIG_FILE) ? JSON.parse(File.read(CONFIG_FILE)) : {}
  rescue StandardError
    @config = {}
  end

  def project_slug
    name = Sketchup.active_model.title.to_s
    name = 'projekt' if name.empty?
    name.downcase.gsub('ł', 'l').gsub(/[^a-z0-9]+/, '-').gsub(/^-|-$/, '')
  end

  def output_dir
    dir = File.join(File.dirname(Sketchup.active_model.path.to_s), 'eksport')
    Dir.mkdir(dir) unless Dir.exist?(dir)
    dir
  rescue StandardError
    UI.messagebox('Zapisz najpierw model, żeby ustalić katalog eksportu.')
    nil
  end

  # 1. Zestawienie roślin: liczy instancje komponentów z atrybutem plant_latin.
  def plant_schedule
    dir = output_dir
    return unless dir

    counts = Hash.new(0)
    meta = {}
    Sketchup.active_model.definitions.each do |definition|
      latin = definition.get_attribute(DICT, 'plant_latin')
      next if latin.nil? || latin.to_s.strip.empty?

      counts[latin] += definition.count_used_instances
      meta[latin] = {
        'polish' => definition.get_attribute(DICT, 'plant_pl').to_s,
        'spacing_cm' => definition.get_attribute(DICT, 'spacing_cm').to_s
      }
    end

    if counts.empty?
      UI.messagebox('Nie znalazłem komponentów z atrybutem plant_latin.')
      return
    end

    path = File.join(dir, "#{project_slug}_rosliny.csv")
    File.open(path, 'w:UTF-8') do |file|
      file.puts('nazwa_lacinska,nazwa_polska,sztuk,rozstawa_cm')
      counts.sort_by { |latin, _| latin.to_s }.each do |latin, qty|
        info = meta[latin] || {}
        file.puts([latin, info['polish'], qty, info['spacing_cm']].map { |v| %("#{v.to_s.gsub('"', '""')}") }.join(','))
      end
    end
    UI.messagebox("Zapisano zestawienie: #{path}")
    path
  end

  # 2. Eksport scen do JPG z nazewnictwem z docs/17-CAD-3D.md §5.
  def export_scenes(width = 2560)
    dir = output_dir
    return unless dir

    model = Sketchup.active_model
    pages = model.pages.to_a
    if pages.empty?
      UI.messagebox('Model nie ma zapisanych scen.')
      return
    end

    stamp = Time.now.strftime('%Y-%m')
    saved = []
    pages.each_with_index do |page, index|
      model.pages.selected_page = page
      scene = page.name.to_s.downcase.gsub(/[^a-z0-9]+/, '-')
      path = File.join(dir, format('%s_%s_%02d-%s_v1.jpg', stamp, project_slug, index + 1, scene))
      model.active_view.write_image(filename: path, width: width, antialias: true, compression: 0.85)
      saved << path
    end
    UI.messagebox("Zapisano #{saved.length} widoków w #{dir}")
    saved
  end

  # 3. Wysyłka pliku do portalu (endpoint /api/studio/asset, token z pliku konfiguracyjnego).
  def upload(path, kind = 'render')
    endpoint = config['endpoint']
    token = config['token']
    if endpoint.nil? || token.nil?
      UI.messagebox("Uzupełnij #{CONFIG_FILE}: endpoint i token.")
      return
    end

    uri = URI.parse(endpoint)
    request = Net::HTTP::Post.new(uri)
    request['Authorization'] = "Bearer #{token}"
    request['Content-Type'] = 'application/json'
    request['Idempotency-Key'] = "#{project_slug}-#{File.basename(path)}"
    request.body = JSON.dump(
      'project_slug' => project_slug,
      'kind' => kind,
      'filename' => File.basename(path),
      'source_app' => 'sketchup',
      'data_base64' => [File.binread(path)].pack('m0')
    )

    response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == 'https') { |http| http.request(request) }
    UI.messagebox(response.code.to_i == 200 ? 'Wysłano do portalu.' : "Błąd wysyłki: #{response.code}")
    response
  rescue StandardError => e
    UI.messagebox("Błąd wysyłki: #{e.message}")
    nil
  end

  unless defined?(@menu_loaded)
    menu = UI.menu('Plugins').add_submenu('Forma Zieleni')
    menu.add_item('Zestawienie roślin do CSV') { plant_schedule }
    menu.add_item('Eksport scen do JPG') { export_scenes }
    menu.add_item('Wyślij ostatni eksport do portalu') do
      dir = output_dir
      newest = dir && Dir.glob(File.join(dir, '*.jpg')).max_by { |f| File.mtime(f) }
      newest ? upload(newest) : UI.messagebox('Brak plików do wysłania.')
    end
    @menu_loaded = true
  end
end
