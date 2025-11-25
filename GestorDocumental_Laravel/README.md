<div align="center">
<a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="300" alt="Laravel Logo"></a>
<h1>Arquetipo API</h1>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
</div>

#### Primeros pasos

Este proyecto está desarrollado para utilizarse como esqueleto de un backend-API, dispone de una conexión a el
archetype-web el cual estará desarrollado en nextJS [https://nextjs.org/docs](https://nextjs.org/docs)

#### Control por docker (Recomendado)

Esta es la opción recomendada, debes tener instalado docker en tu maquina, una vez dispongas de docker-desktop solo
deberás hacer un git-clone del repo y posteriormente dentro de la raiz del repositorio realizar los siguientes comandos.

1. Docker desktop.

- [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)

2. Clonar el repositorio.

- git
  clone [https://github.com/Ledmon-Marketing-y-Multimedia/archetype-api.git](https://github.com/Ledmon-Marketing-y-Multimedia/archetype-api.git)

3. Acceder a la raiz del repositorio.

```bash
cd archetype-api/
```

4. Ejecutar el comando para construir los contenedores.

```bash
docker-compose build
```

5. Ejecutar el comando para arrancar en segundo plano los contenedores.

```bash
docker-compose up -d
```

6. Posteriormente a esto podremos ir a la app de docker-desktop y en containers ver como esta el estado de todos
   nuestros contenedores, nos interesa acceder al de laravel_app, una vez en el deberemos desplazarnos a Exec y ejecutar
   los siguientes comandos.

```bash
php artisan migrate
```

```bash
php artisan db:seed
```

7. Para finalizar es recomendable parar todos los contenedores y volver a iniciarlos para que recargue todo
   correctamente.

#### Control manual sin docker

1. Inicialmente debes tener instalado composer con PHP (Si dispones de XAMPP ya lleva incluido).

- [https://getcomposer.org/](https://getcomposer.org/)

2. Tienes que tirar las dependencias de composer, como es una API nada de npm ni interacciones con el front de laravel.

```bash
composer install
```

3. Una vez acaba de instalar las dependencias y todo fue ok, debemos realizar la configuración de nuestro postgres.

- [https://www.postgresql.org/download/](https://www.postgresql.org/download/)

4. Una vez instalado el motor de bases de datos, necesitaremos instalar el pgAdmin para poder ver nuestra bdd.

- [https://www.pgadmin.org/download/](https://www.pgadmin.org/download/)

5. Una vez tengamos nuestro gestor de BDD entonces podemos continuar con laravel, debemos crear en Postgres una bdd con
   el nombre que queramos, posteriormente a esto en el archivo .ENV de laravel deberéis añadir las configuraciones de
   postgres.

6. Posteriormente a esto ya solo quedará tirar las migraciones y los seed para que cree el usuario principal de la BDD.

- webs@ledmon.com
- password

8. Finalmente a esto solo se deberá ejecutar el servidor de laravel.

```bash
php artisan serve
```

9. En caso de que hagais cambios para no tener que andar a tocar en el servidor de parar/arrancar podeis ejecutar por la
   url del front una petición a /clear-cache para que laravel limpie las caches, las optimice y las vuelva a crear.

#### Documentación

Disponemos de un auto-generador de documentación para la API.

- La libreria es: [https://scramble.dedoc.co/installation](https://scramble.dedoc.co/installation)
- URL DOC: [http://127.0.0.1:8000/docs/api#/](http://127.0.0.1:8000/docs/api#/)

#### Desarrollado

- Equipo de desarrollo: David Fernández
- Empresa propietaria: Ledmon - Marketing


