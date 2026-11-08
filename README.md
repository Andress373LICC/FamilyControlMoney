# Control Money for Family (ControlMoney)

App web gratuita para controlar el dinero personal y familiar. Funciona sin internet, se instala en el teléfono y, si quieres, sincroniza tus datos entre dispositivos con una cuenta.

## Archivos
- `index.html`, `style.css`, `app.js`: la app
- `sw.js`: permite usarla sin conexión (sube `VERSION` cada vez que cambies archivos)
- `manifest.webmanifest`, `icon*`: instalación en el teléfono

## Probar en tu computadora
`python3 -m http.server 8000` dentro de esta carpeta y abre http://localhost:8000

## Publicar en GitHub Pages
1. Crea un repositorio público `control-money-for-family` y sube todos los archivos a la raíz.
2. Settings > Pages > Deploy from a branch > `main` / `(root)` > Save.
3. Tu app quedará en `https://TU-USUARIO.github.io/control-money-for-family/`

## Activar el inicio de sesión (Firebase, opcional)
La app ya trae tu configuración de Firebase en `app.js`. Para que funcione en tu dirección de GitHub:
1. Firebase Console > Authentication > Settings > Authorized domains > agrega `TU-USUARIO.github.io`.
2. Firestore Database > Rules, pega esto y publica (cada persona solo accede a su propio documento):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```
La sincronización guarda la versión más reciente: si usas dos dispositivos, espera a que sincronice antes de cambiar de uno a otro.

## Importante
- Sin iniciar sesión, los datos viven solo en el dispositivo. Usa Más > Copiar respaldo.
- Los datos de tu versión anterior (presupuesto semanal) no se importan; esta empieza limpia.
