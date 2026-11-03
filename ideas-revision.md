# Revisión Weather CLI

- [x] **Colores:** no hay ninguno; falta definir cyan (menú), amarillo (temp), verde/rojo (ok/error).
- [x] **Ciudades:** geocoding solo trae 1 resultado; nombres ambiguos pueden fallar.
- [ ] **Tests:** no existen; conviene al menos probar storage y las APIs con mocks.
- [ ] **Binario:** compila bien; revisar que `./src/config.ts` guarde datos en `~/.config/weather-cli/`.
- [ ] **Escalabilidad:** ¿qué tan fácil será expandir con nuevas funcionalidades?
- [ ] **Carga:** ¿hay estado de carga en las tareas asíncronas?
- [ ] **7 days forecast** agregar la posibilidad de obtener el pronóstico del clima para los próximos 7 dias.
- [x] **CLEAR:** Cada vez que se introduce una respuesta, la consola ha de hacer un clear, solo ha de aparecer la respuesta y el menú pero nada mas
- [ ] **AGENTS.md:** dice que `index.ts` es stub, pero la app ya funciona — hay que actualizarlo. Revisar las nuevas implementaciones que hemos hecho a raíz de este archivo de revisiones
