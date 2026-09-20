DELETE FROM visits;
DELETE FROM webhook_events;
DELETE FROM device_tokens;
DELETE FROM consents;
DELETE FROM soil_status;
DELETE FROM notifications;
DELETE FROM care_tasks;
DELETE FROM referrals;
DELETE FROM invoices;
DELETE FROM projects;
DELETE FROM leads;
DELETE FROM sessions;
DELETE FROM magic_links;
DELETE FROM users;

INSERT INTO users (id, email, name, role, phone, company) VALUES
  ('u-admin', 'agnieszka@formazieleni.pl', 'Agnieszka Pupka', 'admin', '514 220 155', NULL),
  ('u-client', 'anna.kowalska@email.pl', 'Anna Kowalska', 'client', '600 111 222', NULL),
  ('u-partner', 'partner@dampspol.pl', 'DAMPS POL — Biuro', 'partner', '58 000 00 00', 'DAMPS POL');

INSERT INTO leads (id, name, email, phone, city, plot_size, message, source, status, partner_id, notes_json, created_at) VALUES
  ('l1', 'Marek Nowak', 'marek@example.pl', '501 222 333', 'Gdańsk Wrzeszcz', '280 m²', 'Ogród szeregowy.', 'formularz WWW', 'new', NULL, '[]', '2026-09-16T10:00:00.000Z'),
  ('l2', 'Ewa Wiśniewska', 'ewa@example.pl', '502 333 444', 'Sopot', '420 m²', 'Skarpa.', 'DAMPS POL', 'visit', 'partner-damps', '["Wizja 22.09"]', '2026-09-10T14:30:00.000Z'),
  ('l3', 'Piotr Zieliński', 'piotr@example.pl', '503 444 555', 'Gdynia Orłowo', '650 m²', 'Duży ogród.', 'polecenie', 'offer', NULL, '["Wycena"]', '2026-09-05T09:15:00.000Z'),
  ('l4', 'Anna Kowalska', 'anna.kowalska@email.pl', '600 111 222', 'Gdańsk Oliwa', '190 m²', 'Mały ogród.', 'quiz', 'won', NULL, '["→ prj-014"]', '2026-08-01T11:00:00.000Z');

INSERT INTO projects (id, name, client_id, client_name, address, value_pln, current_stage, stages_json, files_json, pins_json, plant_ids_json, created_at, handover_at) VALUES (
  'prj-014', 'Ogród Oliwa — Kowalska', 'u-client', 'Anna Kowalska',
  'ul. Spacerowa 12, Gdańsk Oliwa', 12500, 'projekt',
  '[{"id":"wizyta","label":"Wizyta lokalna","description":"Pomiar.","status":"done","revisionRound":0,"maxRevisions":2,"versionAccepted":true},{"id":"koncepcja","label":"Koncepcja","description":"Strefy.","status":"done","revisionRound":1,"maxRevisions":2,"versionAccepted":true},{"id":"projekt","label":"Projekt","description":"Rysunki.","status":"review","revisionRound":1,"maxRevisions":2,"versionAccepted":false},{"id":"realizacja","label":"Realizacja","description":"Nadzór.","status":"pending","revisionRound":0,"maxRevisions":2},{"id":"odbior","label":"Odbiór","description":"Dokumentacja.","status":"pending","revisionRound":0,"maxRevisions":2},{"id":"garden_os","label":"Garden OS","description":"Opieka.","status":"pending","revisionRound":0,"maxRevisions":2}]',
  '[{"id":"f1","name":"Plan v1.pdf","kind":"plan","version":1,"stageId":"wizyta","uploadedAt":"2026-08-20"}]',
  '[{"id":"pin1","x":32,"y":45,"author":"Anna Kowalska","text":"Ławka zamiast rabaty?","createdAt":"2026-09-13T18:20:00","resolved":false,"replies":[{"id":"pin1-r1","author":"Agnieszka Pupiało","role":"designer","text":"Tak.","at":"2026-09-14T09:10:00"}]}]',
  '["p1","p2","p3"]', '2026-08-12', NULL
);

INSERT INTO invoices (id, number, title, amount, due_date, status, project_id, method, paid_at, transfer_iban, transfer_title) VALUES
  ('inv1', 'FZ/2026/08/014', 'Zaliczka — Oliwa', 4000, '2026-08-20', 'paid', 'prj-014', 'transfer', '2026-08-18T10:00:00.000Z', 'PL61 1090 1014 0000 0712 1981 2874', 'FZ FZ/2026/08/014'),
  ('inv2', 'FZ/2026/09/014', 'II rata — projekt', 4500, '2026-09-25', 'sent', 'prj-014', NULL, NULL, 'PL61 1090 1014 0000 0712 1981 2874', 'FZ FZ/2026/09/014');

INSERT INTO referrals (id, client_name, phone, status, created_at, reward_note, partner_id) VALUES
  ('r1', 'Ewa Wiśniewska', '502 333 444', 'visit', '2026-09-10', 'Rabat DAMPS', 'u-partner'),
  ('r2', 'Tomasz Lewandowski', '504 555 666', 'contacted', '2026-09-14', NULL, 'u-partner');

INSERT INTO care_tasks (id, plant_id, title, description, due_date, priority, source, done, done_at) VALUES
  ('ct1', 'p2', 'Podlej hortensję', 'Sprawdź wilgotność.', '2026-09-20', 'high', 'weather', 0, NULL),
  ('ct2', 'p1', 'Przytnij miskanta', 'Usuń źdźbła.', '2026-03-15', 'medium', 'calendar', 0, NULL);

INSERT INTO notifications (id, user_id, title, body, type, task_id, created_at, read) VALUES
  ('n1', 'u-client', 'Projekt do akceptacji', 'Etap Projekt czeka.', 'project', NULL, '2026-09-16T08:00:00.000Z', 0),
  ('n2', 'u-client', 'Pielęgnacja', 'Podlej hortensję.', 'care', 'ct1', '2026-09-18T07:00:00.000Z', 0),
  ('n3', 'u-client', 'Faktura', 'FZ/2026/09/014', 'payment', NULL, '2026-09-17T10:00:00.000Z', 0);

INSERT INTO soil_status (id, moisture, temp_c, ph, last_measured_at, suggestion, suggestion_label, weather_json) VALUES
  ('default', 'optymalnie', 14.2, 6.5, '2026-09-18T06:00:00.000Z', 'nie_podlewaj', 'Wilgotność OK.',
   '{"tempC":16,"rainMm":0.2,"frostRisk":false,"windMs":3.1,"condition":"częściowe zachmurzenie","updatedAt":"2026-09-18T06:00:00.000Z","city":"Gdańsk","source":"mock"}');

INSERT INTO consents (user_id, marketing, push, analytics, privacy_accepted_at) VALUES
  ('u-client', 0, 1, 0, '2026-08-12T12:00:00.000Z'),
  ('u-admin', 0, 0, 0, '2026-01-01T00:00:00.000Z'),
  ('u-partner', 1, 0, 0, '2026-06-01T00:00:00.000Z');
