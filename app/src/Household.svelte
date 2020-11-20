<script lang="ts">
  import {
    chanceToBeInfectedInPast,
    getInfectionRate,
    listCounties,
  } from "./covid";

  export let states: string[];
  export let name: string;
  export let people: number;

  let state = "MN";

  $: counties = listCounties(state);

  let county = null;
</script>

<div>{name}</div>
<label>state
  <select bind:value={state}>
    {#each states as state}
      <option>{state}</option>
    {/each}
  </select>
</label>
{#if state}
  <label>county
    <select bind:value={county}>
      {#each counties as county}
        <option>{county}</option>
      {/each}
    </select>
  </label>
{/if}
<span>Chance of individual being infected in past 14 days %{(chanceToBeInfectedInPast(14, state, county) * 100).toFixed(4)}</span>
<h3>People</h3>
<input bind:value={people} type="number" />
<div>
  Chance of household being infected in past 14 days %{(chanceToBeInfectedInPast(14, state, county) * people * 100).toFixed(4)}
</div>
