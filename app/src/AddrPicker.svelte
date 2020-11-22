<script lang="ts" context="module">
  var count = 0;
</script>

<script lang="ts">
  import {
    chanceForIndividualToBeInfectedInPast,
    getInfectionCount,
    getInfectionRate,
    listCounties,
    listStates,
  } from "./covid";

  import type { AddressType } from "./types";

  export let addr: AddressType;

  count++;

  let states = listStates().sort();
  addr.state = states[0];
  let counties = listCounties(addr.state);
  if (counties) {
    addr.county = counties[0];
  }

  function stateSelected() {
    counties = listCounties(addr.state);
    addr.county = counties[0];
  }
</script>

<style>
  label {
    display: inline;
  }

  .flex {
    display: flex;
  }

  .flex > div {
    width: 50%;
  }

  .info {
    border: 1px solid #dadada;
    padding: 0.5rem;
    border-radius: 0.5rem;
    background-color: #fafafa;
  }

  .info p {
    margin-top: 0;
  }

  @media only screen and (max-width: 600px) {
    .flex {
      flex-direction: column;
    }

    .flex > div {
      width: 100%;
    }
  }
</style>

<div class="flex">
  <div>
    <div>
      <label for="state-select-{count}">state</label>
      <select
        id="state-select-{count}"
        bind:value={addr.state}
        on:change={stateSelected}
        on:blur={stateSelected}>
        {#each states as state}
          <option>{state}</option>
        {/each}
      </select>
    </div>
    {#if addr.state}
      <div>
        <label for="county-select-{count}">county</label>
        <select id="county-select-{count}" bind:value={addr.county}>
          {#each counties as county}
            <option>{county}</option>
          {/each}
        </select>
      </div>
    {/if}
  </div>
  <div class="info">
    <small>
      <p>Data for {addr.county} county:</p>
      {getInfectionCount(addr).toFixed(2)}
      infections per day in the past two weeks.
      {(getInfectionRate(addr) * 100).toFixed(2)}
      infections per 100 people per day.
      {(chanceForIndividualToBeInfectedInPast(14, addr) * 100).toFixed(3)}%
      chance of an individual in this county to have been infectd within the
      14-day incubation period.
    </small>
  </div>
</div>
