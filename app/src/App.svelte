<script lang="ts">
  import Household from "./Household.svelte";
  import { getPop, listStates } from "./covid";
  import type { HouseholdType } from "./types";

  let households: HouseholdType[] = [
    {
      name: "Your Household",
      people: [
        {
          name: "You",
          age: null,
        },
      ],
      address: {},
    },
  ];

  let states = [" ", ...listStates()].sort();

  function addHousehold() {
    households = [
      ...households,
      {
        name: "New Household",
        people: [],
        address: {},
      },
    ];
  }
</script>

<style>
</style>

<main>
  <h1>Deadly Thanksgiving</h1>
  <h2>Households</h2>
  <ul>
    {#each households as household}
      <li>
        <Household
          {states}
          bind:people={household.people.length}
          name={household.name} />
      </li>
    {/each}
  </ul>
  <button on:click={addHousehold}>add household</button>
  <div>Risk:</div>
</main>
