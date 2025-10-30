<template>
  <div class="not-found">
    <h1>Error 404</h1>
    <p>La página que buscas no existe.</p>
    <router-link to="/Dashboard">Volver al inicio</router-link>
  </div>
</template>

<script>
export default {
  name: "NotFound",
};
</script>

<style scoped>
.not-found {
  text-align: center;
  padding: 40px;
}
</style>
