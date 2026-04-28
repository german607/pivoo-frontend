# 🎯 Pivoo - Guía Interna de Capacidades

Documento técnico que explica en detalle cómo funciona cada capability (característica) del frontend de Pivoo, la arquitectura interna, hooks, contextos y patrones de desarrollo.

---

## 📑 Tabla de Contenidos

1. [Autenticación](#autenticación)
2. [Gestión de API](#gestión-de-api)
3. [Gestión de Equipos](#gestión-de-equipos)
4. [Gestión de Partidos](#gestión-de-partidos)
5. [Gestión de Torneos](#gestión-de-torneos)
6. [Internacionalización](#internacionalización)
7. [Patrones Arquitectónicos](#patrones-arquitectónicos)
8. [Guía de Desarrollo](#guía-de-desarrollo)

---

## 🔐 Autenticación

### Descripción General
Sistema de autenticación centralizado que maneja login, registro y estado global del usuario.

### Ubicación
- **Web**: `apps/web/src/contexts/auth.tsx`
- **Mobile**: `apps/mobile/src/contexts/auth.tsx`

### Cómo Funciona

```typescript
// Auth Context expone:
interface AuthContextType {
  user: User | null;           // Usuario actual logueado
  isLoading: boolean;          // Estado de carga inicial
  login(email, password): Promise<void>;
  register(data): Promise<void>;
  logout(): Promise<void>;
}
```

### Flujo de Autenticación

```
┌─────────────────────────────────────────────────────┐
│ 1. INICIACIÓN                                       │
├─────────────────────────────────────────────────────┤
│ useEffect() → AuthProvider → verificar token        │
└─────────────┬───────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│ 2. RECUPERAR SESIÓN                                 │
├─────────────────────────────────────────────────────┤
│ Si token existe en storage → GET /auth/me           │
│ Si válido → setUser(userData)                       │
│ Si inválido → logout()                              │
└─────────────┬───────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│ 3. USUARIOS NO AUTENTICADOS                         │
├─────────────────────────────────────────────────────┤
│ Redirect a /login                                   │
│ Protected routes verifican: !user && !authLoading   │
└─────────────────────────────────────────────────────┘
```

### Implementación en Componentes

```typescript
// Dentro de un componente
const { user, isLoading: authLoading } = useAuth();

useEffect(() => {
  if (!authLoading && !user) {
    router.push('/login');
    return;
  }
  // Cargar datos solo si usuario está autenticado
  if (!authLoading && user) loadData();
}, [authLoading, user]);
```

### Almacenamiento del Token
- **Web**: `localStorage` (con SameSite cookie)
- **Mobile**: `expo-secure-store` (almacenamiento seguro nativo)

---

## 📡 Gestión de API

### Descripción General
Hook centralizado para realizar llamadas HTTP con manejo automático de autenticación y errores.

### Ubicación
- **Web**: `apps/web/src/hooks/useApi.ts`
- **Mobile**: `apps/mobile/src/hooks/useApi.ts`

### Cómo Funciona

```typescript
const { get, post, patch, delete: del } = useApi();

// Métodos disponibles
get<T>(url, options?): Promise<T>
post<T>(url, data, options?): Promise<T>
patch<T>(url, data, options?): Promise<T>
delete<T>(url, options?): Promise<T>
```

### Opciones

```typescript
interface ApiOptions {
  baseUrl?: string;           // URL base personalizada (ej: TEAMS_API_URL)
  headers?: Record<string, string>;
  signal?: AbortSignal;       // Para cancelar requests
}
```

### Ejemplo de Uso

```typescript
const { get, post } = useApi();

// GET - Obtener datos
const teamData = await get<TeamDetail>(
  `/api/v1/teams/${teamId}`,
  { baseUrl: process.env.NEXT_PUBLIC_TEAMS_API_URL }
);

// POST - Crear datos
await post(
  `/api/v1/teams/${teamId}/invitations`,
  { userId: 'user123' },
  { baseUrl: process.env.NEXT_PUBLIC_TEAMS_API_URL }
);

// Manejo de errores
try {
  const data = await get('/api/endpoint');
} catch (error) {
  console.error('Error:', error);
  // Mostrar toast o mensaje de error
}
```

### Interceptores Automáticos

El hook `useApi` automáticamente:
1. ✅ Añade header `Authorization: Bearer {token}`
2. ✅ Parsea respuestas JSON
3. ✅ Maneja errores HTTP
4. ✅ Redirige a login si 401/403
5. ✅ Serializa body en POST/PATCH

---

## 👥 Gestión de Equipos

### Descripción General
Capacidad para crear, modificar y administrar equipos de jugadores.

### Ubicación
- **Página de detalle**: [apps/web/src/app/[locale]/teams/[id]/page.tsx](apps/web/src/app/[locale]/teams/[id]/page.tsx)
- **Listado**: `apps/web/src/app/[locale]/teams/page.tsx`

### Estado Local

```typescript
const [team, setTeam] = useState<TeamDetail | null>(null);
const [stats, setStats] = useState<TeamStats | null>(null);
const [isLoading, setIsLoading] = useState(true);
const [inviteUserId, setInviteUserId] = useState('');
const [isEditing, setIsEditing] = useState(false);
const [editName, setEditName] = useState('');
```

### Acciones Principales

#### 1. **Cargar Equipo y Estadísticas**
```typescript
const loadData = async () => {
  const [teamData, statsData] = await Promise.all([
    get<TeamDetail>(`/api/v1/teams/${teamId}`),
    get<TeamStats>(`/api/v1/teams/${teamId}/stats`).catch(() => null)
  ]);
  setTeam(teamData);
  setStats(statsData);
};
```

#### 2. **Invitar Miembro**
```typescript
const sendInvite = async () => {
  if (!inviteUserId.trim()) return;
  try {
    await post(
      `/api/v1/teams/${teamId}/invitations`,
      { userId: inviteUserId.trim() }
    );
    setInviteUserId('');
    await loadData(); // Refrescar equipo
  } catch {}
};
```

#### 3. **Remover Miembro**
```typescript
const removeMember = async (userId: string) => {
  try {
    await del(`/api/v1/teams/${teamId}/members/${userId}`);
    await loadData();
  } catch {}
};
```

#### 4. **Editar Nombre del Equipo**
```typescript
const saveName = async () => {
  try {
    await patch(
      `/api/v1/teams/${teamId}`,
      { name: editName.trim() }
    );
    setIsEditing(false);
    await loadData();
  } catch {}
};
```

#### 5. **Disolver Equipo**
```typescript
const disband = async () => {
  if (!confirm(t('disbandConfirm'))) return;
  try {
    await del(`/api/v1/teams/${teamId}`);
    router.push('/teams'); // Redirect al listado
  } catch {}
};
```

### Control de Permisos

```typescript
const isAdmin = team?.adminUserId === user?.id;

// Solo admins pueden:
// - Editar nombre del equipo
// - Invitar miembros
// - Remover miembros
// - Disolver equipo
```

### Interfaces de Datos

```typescript
interface TeamMember {
  id: string;
  userId: string;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

interface TeamDetail {
  id: string;
  name: string;
  color: string;
  sportId: string | null;
  adminUserId: string;
  members: TeamMember[];
  invitations: { id: string; invitedUserId: string }[];
}

interface TeamStats {
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  winRate: number;
  teamName: string;
  memberCount: number;
  recentMatches: Array<{ id: string; sportId: string; scheduledAt: string }>;
  note?: string;
}
```

---

## ⚽ Gestión de Partidos

### Descripción General
Capacidad para crear, ver y participar en partidos deportivos.

### Ubicación
- **Detalle**: `apps/web/src/app/[locale]/matches/[id]/page.tsx`
- **Listado**: `apps/web/src/app/[locale]/matches/page.tsx`
- **Crear**: `apps/web/src/app/[locale]/matches/new/page.tsx`
- **Mobile**: `apps/mobile/src/app/(tabs)/matches`

### Flujo de Creación de Partido

```
┌───────────────────────────────────────────┐
│ Usuario accede a /matches/new              │
├───────────────────────────────────────────┤
│ 1. Selecciona deporte (TENNIS, PADEL)     │
│ 2. Elige formato (individual/equipo)      │
│ 3. Define horario y ubicación             │
│ 4. Configura nivel de habilidad (skill)   │
└────────────┬────────────────────────────────┘
             │
             ▼
┌───────────────────────────────────────────┐
│ POST /api/v1/matches                      │
│ Body: {                                   │
│   sportId,                                │
│   scheduledAt,                            │
│   location,                               │
│   format,                                 │
│   skillLevel                              │
│ }                                         │
└────────────┬────────────────────────────────┘
             │
             ▼
┌───────────────────────────────────────────┐
│ Partido creado + usuario registrado       │
│ Redirect a /matches/[id]                  │
└───────────────────────────────────────────┘
```

### Estados de Partido

```typescript
enum MatchStatus {
  OPEN = 'OPEN',              // Abierto a participantes
  FULL = 'FULL',              // Cupos llenos
  IN_PROGRESS = 'IN_PROGRESS', // En juego
  COMPLETED = 'COMPLETED',    // Finalizado
  CANCELLED = 'CANCELLED'     // Cancelado
}
```

### Componente MatchCard

```typescript
// Ubicación: apps/web/src/components/MatchCard.tsx
interface MatchCardProps {
  match: MatchDetail;
  onParticipate?: (matchId: string) => void;
  onCancel?: (matchId: string) => void;
}

// Renderiza:
// - Deporte y horario
// - Ubicación
// - Participantes actuales
// - Botón para registrarse
// - Indicador de estado
```

---

## 🏆 Gestión de Torneos

### Descripción General
Capacidad para crear y administrar torneos con múltiples participantes.

### Ubicación
- **Detalle**: `apps/web/src/app/[locale]/tournaments/[id]/page.tsx`
- **Listado**: `apps/web/src/app/[locale]/tournaments/page.tsx`
- **Crear**: `apps/web/src/app/[locale]/tournaments/new/page.tsx`

### Estados de Torneo

```typescript
enum TournamentStatus {
  DRAFT = 'DRAFT',                    // Borrador
  REGISTRATION_OPEN = 'REGISTRATION_OPEN',    // Abierto a registros
  REGISTRATION_CLOSED = 'REGISTRATION_CLOSED', // Registros cerrados
  IN_PROGRESS = 'IN_PROGRESS',        // En curso
  COMPLETED = 'COMPLETED',            // Finalizado
  CANCELLED = 'CANCELLED'             // Cancelado
}
```

### Formatos de Torneo

```typescript
enum TournamentFormat {
  SINGLE_ELIMINATION = 'SINGLE_ELIMINATION', // Eliminación directa
  ROUND_ROBIN = 'ROUND_ROBIN'                // Todos contra todos
}
```

### Estados de Participante

```typescript
enum TournamentParticipantStatus {
  PENDING = 'PENDING',       // Esperando aprobación
  APPROVED = 'APPROVED',     // Aprobado
  REJECTED = 'REJECTED',     // Rechazado
  WITHDRAWN = 'WITHDRAWN'    // Se retiró
}
```

### Capacidades de Administrador

- ✅ Crear torneo
- ✅ Modificar detalles
- ✅ Aprobar/rechazar participantes
- ✅ Generar bracket
- ✅ Actualizar resultados
- ✅ Cancelar torneo

---

## 🌍 Internacionalización

### Descripción General
Sistema de traducciones multiidioma (Español e Inglés) con soporte a nivel de rutas.

### Ubicación
- **Config**: `apps/web/src/i18n/`
- **Traducciones**: `apps/web/messages/`
- **Middleware**: `apps/web/src/middleware.ts`

### Archivos de Traducción

```
messages/
├── en.json       # Inglés
└── es.json       # Español
```

### Estructura de Traducciones

```json
{
  "common": {
    "loading": "Loading...",
    "error": "An error occurred"
  },
  "teamDetail": {
    "members": "Team Members",
    "inviteMember": "Invite Member",
    "save": "Save",
    "cancel": "Cancel"
  }
}
```

### Uso en Componentes

```typescript
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('teamDetail');  // namespace
  const tc = useTranslations('common');
  
  return (
    <>
      <h1>{t('members')}</h1>
      <p>{tc('loading')}</p>
    </>
  );
}
```

### Rutas Localizadas

```
/                     → Redirecciona a /es o /en
/es/teams            → Ruta en español
/es/teams/123        → Equipo 123 en español
/en/teams            → Ruta en inglés
/en/teams/123        → Equipo 123 en inglés
```

### Cambiar Idioma

```typescript
import { useRouter } from '@/navigation';
import { usePathname } from 'next/intl/navigation';

function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  
  const switchLanguage = (locale: 'en' | 'es') => {
    router.push(pathname, { locale });
  };
  
  return (
    <>
      <button onClick={() => switchLanguage('es')}>Español</button>
      <button onClick={() => switchLanguage('en')}>English</button>
    </>
  );
}
```

---

## 🏗️ Patrones Arquitectónicos

### 1. **Context API para Estado Global**

```typescript
// Crear contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Proveedor
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Lógica de inicialización
  }, []);
  
  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### 2. **Hooks Personalizados**

```typescript
// Hook reutilizable con lógica
export function useApi() {
  const { user } = useAuth();
  
  const request = async (method, url, data, options) => {
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${user?.token}`,
        ...options?.headers
      },
      body: data ? JSON.stringify(data) : undefined
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Handle unauthorized
      }
      throw new Error('Request failed');
    }
    
    return response.json();
  };
  
  return {
    get: (url, opts) => request('GET', url, null, opts),
    post: (url, data, opts) => request('POST', url, data, opts),
    patch: (url, data, opts) => request('PATCH', url, data, opts),
    delete: (url, opts) => request('DELETE', url, null, opts)
  };
}
```

### 3. **Interfaces TypeScript Compartidas**

```typescript
// packages/shared/src/types.ts
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  skillLevel: SkillLevel;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  adminUserId: string;
}

// Importar en apps
import { User, Team } from '@pivoo/shared';
```

### 4. **Patrón de Carga Asincrónica**

```typescript
const [data, setData] = useState(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const loadData = async () => {
    try {
      setIsLoading(true);
      const result = await fetch('/api/data');
      setData(result);
      setError(null);
    } catch (err) {
      setError(err);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  loadData();
}, []);

// En render
if (isLoading) return <Spinner />;
if (error) return <Error message={error} />;
if (!data) return <Empty />;
return <Content data={data} />;
```

### 5. **Composición de Componentes**

```typescript
// Card reutilizable
export function Card({ children, className }) {
  return (
    <div className={cn("rounded-lg shadow bg-white p-4", className)}>
      {children}
    </div>
  );
}

// Uso
<Card>
  <h2>Team Details</h2>
  <TeamList members={team.members} />
</Card>
```

---

## 🛠️ Guía de Desarrollo

### Crear una Nueva Página Web

```typescript
// apps/web/src/app/[locale]/my-feature/page.tsx
'use client';

import { useAuth } from '@/contexts/auth';
import { useApi } from '@/hooks/useApi';
import { useTranslations } from 'next-intl';
import { Header } from '@/components/Header';

export default function MyFeaturePage() {
  const { user } = useAuth();
  const { get } = useApi();
  const t = useTranslations('myFeature');
  
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await get('/api/v1/my-endpoint');
        setData(result);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12">
        {isLoading ? <Spinner /> : <Content data={data} />}
      </main>
    </div>
  );
}
```

### Crear un Nuevo Hook

```typescript
// apps/web/src/hooks/useMyData.ts
import { useState, useEffect } from 'react';
import { useApi } from './useApi';

export function useMyData(id: string) {
  const { get } = useApi();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const load = async () => {
      try {
        const result = await get(`/api/v1/my-data/${id}`);
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    load();
  }, [id, get]);
  
  return { data, isLoading, error };
}
```

### Agregar Traducción Nueva

1. **Editar `messages/es.json`**:
```json
{
  "myFeature": {
    "title": "Mi Característica",
    "description": "Descripción en español"
  }
}
```

2. **Editar `messages/en.json`**:
```json
{
  "myFeature": {
    "title": "My Feature",
    "description": "Description in English"
  }
}
```

3. **Usar en componente**:
```typescript
const t = useTranslations('myFeature');
<h1>{t('title')}</h1>
<p>{t('description')}</p>
```

### Testing

```typescript
// Patrón recomendado
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from '@/contexts/auth';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should load and display data', async () => {
    render(
      <AuthProvider>
        <MyComponent />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Data loaded')).toBeInTheDocument();
    });
  });
});
```

---

## 📚 Recursos Útiles

### Documentación Externa
- [Next.js App Router](https://nextjs.org/docs/app)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Expo Documentation](https://docs.expo.dev)
- [next-intl](https://next-intl-docs.vercel.app)

### Archivos Clave
- `turbo.json` - Configuración del monorepo
- `tsconfig.json` - TypeScript (raíz + por app)
- `next.config.js` - Configuración Next.js
- `tailwind.config.js` - Configuración Tailwind

---

## 🔗 Relaciones Entre Capacidades

```
Autenticación
    ├─→ useApi (inyecta token)
    ├─→ useAuth (state global)
    └─→ Protected routes

useApi
    ├─→ Llamadas a Teams API
    ├─→ Llamadas a Matches API
    ├─→ Llamadas a Tournaments API
    └─→ Manejo automático de errores

Gestión de Equipos
    ├─→ useApi (CRUD)
    ├─→ useAuth (permisos)
    └─→ TeamStats (visualización)

Gestión de Partidos
    ├─→ useApi (crear/listar)
    ├─→ useAuth (participantes)
    └─→ MatchCard (componente)

i18n
    ├─→ Next.js middleware
    ├─→ useTranslations hook
    └─→ Routing basado en locale
```

---

**Última actualización**: Abril 2026  
**Versión**: 1.0
