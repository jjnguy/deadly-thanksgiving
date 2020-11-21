<script lang="ts">
  import AddrPicker from "./AddrPicker.svelte";
  import {
    chanceForHouseholdToBeInfectedInPast,
    chanceForIndividualToBeInfectedInPast,
    getInfectionRate,
    listCounties,
  } from "./covid";

  export let name: string;
  export let people: number;

  let addr = { state: "MN", county: null };
</script>

<div>{name}</div>
<AddrPicker bind:addr />
<span>Chance of individual being infected in past 14 days %{(chanceForIndividualToBeInfectedInPast(14, addr) * 100).toFixed(4)}</span>
<h3>People</h3>
<input bind:value={people} type="number" />
<div>
  Chance of household being infected in past 14 days %{(chanceForHouseholdToBeInfectedInPast(
      14,
      { address: addr, size: people }
    ) * 100).toFixed(4)}
</div>
