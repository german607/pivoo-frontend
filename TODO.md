# TODO

## Pendientes

### Backend
- [ ] Deployar matches-service en Railway para que tome el campo `complexName` (railway.toml ya tiene `prisma db push` en startCommand)
- [ ] Endpoint `GET /api/v1/matches/mine` requiere deploy del matches-service actualizado
- [ ] Verificar que OAuth de Google funciona en produccion con las URIs correctas en Google Cloud Console

### Frontend
- [x] Pagina de perfil: mejorar diseño general (dark theme, campos pais/ciudad/telefono/nacimiento, combobox de pais, date picker por selects)
- [ ] Pagina de perfil: mostrar avatar del usuario
- [x] Pagina de perfil: mostrar username ademas del nombre
- [ ] Mis partidos: link a la pagina de detalle del partido desde cada tarjeta
- [ ] Mis partidos: separar seccion en "Proximos" y "Jugados"
- [ ] Match detail: mostrar resultado grabado visualmente cuando el partido esta COMPLETED
- [ ] Match detail: el formulario de resultado solo aparece para IN_PROGRESS y FULL — evaluar si tambien mostrarlo para OPEN (partidos sin suficientes jugadores que igual se jugaron)
- [x] Look & Feel de cards internas se siente sin vida (teams, teams/[id], crear partido rediseñados a dark slate)

### UX / Diseño
- [ ] Notificaciones: avisar al usuario cuando lo aprueban/rechazan en un partido
- [ ] Notificaciones: avisar al admin cuando alguien solicita unirse
- [ ] Pagina de ranking de jugadores por deporte
- [ ] Busqueda de usuarios por username para invitar a partidos (hoy hay que poner el ID)

### Monetizacion
- [ ] Publicidad: agregar sponsored cards nativas (mismo estilo dark slate-800) inyectadas cada N elementos en listas de partidos y torneos

### Plan Pro (suscripcion paga)
Limites del plan gratuito que se desbloquean con Pro:

**Equipos**
- [ ] Free: 1 equipo por deporte. Pro: equipos ilimitados por deporte
- [ ] Free: hasta 6 miembros por equipo. Pro: equipos ilimitados en miembros
- [ ] Pro: estadisticas avanzadas del equipo (racha, historial vs oponentes, heatmap de rendimiento por mes)

**Partidos**
- [ ] Free: 1 partido creado por dia. Pro: partidos ilimitados
- [ ] Free: partidos publicos solamente. Pro: partidos privados con codigo de invitacion
- [ ] Pro: partido recurrente (crear una serie semanal con un solo click)

**Torneos**
- [ ] Free: 1 torneo activo a la vez, maximo 8 participantes. Pro: torneos ilimitados, hasta 64 participantes
- [ ] Pro: bracket personalizable y fase de grupos antes de eliminacion directa

**Perfil**
- [ ] Pro: insignia verificada visible en el perfil y en los partidos
- [ ] Pro: estadisticas extendidas (historial completo, evolucion de ranking con grafico)
- [ ] Pro: perfil publico con URL personalizada (ej. pivoo.app/u/german)

**Complejos (plan separado para role COMPLEX)**
- [ ] Free: 1 complejo, hasta 3 canchas. Pro: complejos ilimitados, canchas ilimitadas
- [ ] Pro: panel de analiticas (partidos jugados, canchas mas reservadas, pico de actividad)
- [ ] Pro: publicar stories efimeras (24h) en el feed social

### Ideas
- [ ] Partidos privados con codigo de invitacion
- [ ] Chat dentro del partido
- [ ] Integracion con Google Calendar al unirse a un partido
- [ ] Estadisticas avanzadas de jugador (racha, historial por oponente)
- [ ] Pagina publica de perfil de jugador accesible por username
- [ ] Mostrar modificador de nivel/categoria

## Ideas long-term
- [ ] Feed social como pagina principal: publicaciones de jugadores y complejos que el usuario sigue (texto + imagenes), mezcladas con 2-3 partidos recomendados segun deporte, nivel y ubicacion
- [ ] Sistema de seguimiento: seguir jugadores y complejos, con contadores de seguidores/seguidos en el perfil
- [ ] Publicacion automatica al registrar resultado de un partido ("X gano contra Y en Padel - Club Z")
- [ ] Stories de complejos: contenido efimero (24h) para que los complejos publiquen disponibilidad, ofertas, fotos de pistas
- [ ] Sugerencias de conexion post-partido: "jugaste con estos jugadores, seguirlos?"
- [ ] Trending local: seccion en el feed con los torneos y partidos mas populares de tu zona esta semana
- [ ] Reacciones a publicaciones: emojis de reaccion rapida (fuego, raqueta, etc.) sin necesidad de comentar

