# TODO

## Pendientes

### Backend
- [ ] Deployar matches-service en Railway para que tome el campo `complexName` (railway.toml ya tiene `prisma db push` en startCommand)
- [ ] Endpoint `GET /api/v1/matches/mine` requiere deploy del matches-service actualizado
- [ ] Verificar que OAuth de Google funciona en produccion con las URIs correctas en Google Cloud Console

### Frontend
- [ ] Pagina de perfil: mejorar diseño general (actualmente usa Card con fondo blanco sobre fondo slate-900)
- [ ] Pagina de perfil: mostrar avatar del usuario
- [ ] Pagina de perfil: mostrar username ademas del nombre
- [ ] Mis partidos: link a la pagina de detalle del partido desde cada tarjeta
- [ ] Mis partidos: separar seccion en "Proximos" y "Jugados"
- [ ] Match detail: mostrar resultado grabado visualmente cuando el partido esta COMPLETED
- [ ] Match detail: el formulario de resultado solo aparece para IN_PROGRESS y FULL — evaluar si tambien mostrarlo para OPEN (partidos sin suficientes jugadores que igual se jugaron)

### UX / Diseño
- [ ] Notificaciones: avisar al usuario cuando lo aprueban/rechazan en un partido
- [ ] Notificaciones: avisar al admin cuando alguien solicita unirse
- [ ] Pagina de ranking de jugadores por deporte
- [ ] Busqueda de usuarios por username para invitar a partidos (hoy hay que poner el ID)

### Ideas
- [ ] Partidos privados con codigo de invitacion
- [ ] Chat dentro del partido
- [ ] Integracion con Google Calendar al unirse a un partido
- [ ] Estadisticas avanzadas de jugador (racha, historial por oponente)
- [ ] Pagina publica de perfil de jugador accesible por username
- [ ] Mostrar modificador de nivel/categoria
