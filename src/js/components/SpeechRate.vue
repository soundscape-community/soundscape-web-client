
<template>
  <div id="rate" title="Speaking rate">
    <button id="decreaseRate" @click="decrease" title="Decrease speaking rate">−</button>
    <div id="rateValue">{{ rate }}</div>
    <button id="increaseRate" @click="increase" title="Increase speaking rate">+</button>
  </div>
</template>

<script setup>
import { inject, ref, onMounted } from 'vue';

const audioQueue = inject('audioQueue');
const rate = ref(1);

onMounted(() => {
  rate.value = audioQueue.rate; // Set initial rate
});

const increase = () => {
  rate.value = audioQueue.increaseRate();
}

const decrease = () => {
  rate.value = audioQueue.decreaseRate();
}
</script>
