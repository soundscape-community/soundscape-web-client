<template>
  <nav>
    <button
      @click="$router.go(-1)"
      title="Back"
      class="nav-button"
    >
      &laquo;
    </button>
    <h1>{{ title }}</h1>
    <div></div> <!-- balance nodes in nav so h1 is centered -->
  </nav>
</template>

<script setup>
const props = defineProps({
  title: String,
})
</script>