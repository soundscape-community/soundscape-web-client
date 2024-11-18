<template>
  <div :title="title">
    <button @click="decrement" title="Decrease">−</button>
    <span>{{ value }}</span>
    <button @click="increment" title="Increase">+</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface CounterProps {
  title: string;
  initial: number;
  min: number;
  max: number;
  incAction: () => number;
  decAction: () => number;
}
const props = defineProps<CounterProps>();


const value = ref<number>(props.initial);

const increment = (): void => {
  if (value.value < props.max) {
    value.value = props.incAction();
  }
}

const decrement = (): void => {
  if (value.value > props.min) {
    value.value = props.decAction();
  }
}
</script>

<style scoped>
div {
  display: flex;
  /* flex-direction: row; */
  align-items: center;
  justify-content: center;
  background-color: #e74c3d;
  cursor: pointer;
  font-size: 1.1em;
  margin-right: 10px;
  padding: 5px;
  border-radius: 8px;
  max-width: 20%;
}

span {
  height: 30px;
  padding: 0 10px;
  font-size: 1em;
}

a {
  color: white;
}

button {
  background-color: transparent;
  border: none;
  color: white;
  padding: 1vw;
  font-size: 1em;
  display: flex;
  justify-content: center;
  align-items: center;
}

@media screen and (min-width: 600px) {
  div {
      font-size: 1.2em;
      padding: 0px;
  }

  span {
      font-size: 1.2em;
  }

  button {
      padding: 15px;
      font-size: 1.2em;
  }

  button:hover {
      cursor: pointer;
  }
}
</style>