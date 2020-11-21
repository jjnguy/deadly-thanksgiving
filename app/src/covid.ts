import covidInfections from "./covid_infections.json";
import covidPop from "./covid_populations.json";
import type { AddressType, HouseholdType } from "./types";


let statePopCache: Map<string, number> = new Map<string, number>();

let stateList: string[] = null;
function listStates(): string[] {
  if (!stateList) {
    stateList = Array.from(new Set(covidPop.map(item => item.state)));
  }

  return stateList;
}

function listCounties(state: string) {
  return covidPop.filter(it => it.state == state && it.county != "Statewide Unallocated").map(it => it.county);
}

function getPop(addr: AddressType): number {
  if (!addr.state && addr.county) throw 'must supply state with county';

  if (!addr.state) return covidPop.reduce((acum, next) => acum + next.pop, 0);

  if (addr.county) {
    let cty = covidPop.filter(item => item.state == addr.state && item.county == addr.county)[0];
    if (cty) return cty.pop;
    return getPop({ state: addr.state });
  }

  if (!statePopCache[addr.state]) {
    let result = covidPop
      .filter(pop => pop.state == addr.state)
      .reduce((acum, next) => acum + next.pop, 0);

    statePopCache[addr.state] = result;
  }

  return statePopCache[addr.state];
}

let stateInfectionCache: Map<string, number> = new Map<string, number>();
let overallInfectionAverage: number = null;
function getInfectionCount(addr: AddressType): number {
  if (!addr.state && addr.county) throw 'must supply state with county';

  if (!addr.state && !addr.county) {
    if (!overallInfectionAverage) {
      overallInfectionAverage = covidInfections.reduce((acum, next) => acum + next.avgInfected, 0) / covidInfections.length;
    }
    return overallInfectionAverage;
  }

  if (addr.county) {
    let cty = covidInfections.filter(item => item.state == addr.state && item.county == addr.county)[0];
    if (cty) return cty.avgInfected;
    return getInfectionCount({ state: addr.state });
  }

  if (!stateInfectionCache[addr.state]) {
    let stateEntries = covidInfections
      .filter(item => item.state == addr.state);
    let result = stateEntries
      .reduce((acum, next) => acum + next.avgInfected, 0) / stateEntries.length;

    stateInfectionCache[addr.state] = result;
  }

  return stateInfectionCache[addr.state];
}

function getInfectionRate(addr: AddressType) {
  return getInfectionCount(addr) / getPop(addr);
}

function chanceForIndividualToBeInfectedInPast(numDays: number, addr: AddressType) {
  return getInfectionRate(addr) * numDays;
}

function chanceForHouseholdToBeInfectedInPast(numDays: number, household: HouseholdType) {
  let probOne = chanceForIndividualToBeInfectedInPast(numDays, household.address);
  let combinations = 0;
  for (let i = 1; i <= household.size; i++) {
    let sign = i % 2 == 0 ? -1 : 1;
    combinations += sign * (nCr(household.size, i) * Math.pow(probOne, i));
  }
  return combinations;
}



function nCr(n: number, r: number): number {
  return factorial(n) / (factorial(r) * factorial(n - r));
}

let memory = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800, 39916800, 479001600, 6227020800, 87178291200, 1307674368000, 20922789888000];
function factorial(n: number): number {
  if (n < 0) return 0;
  if (n < memory.length) return memory[n];
  let result = factorial(n - 1) * n;
  memory[n] = result;
  return result;
}

export { listStates, listCounties, getPop, getInfectionCount, getInfectionRate, chanceForIndividualToBeInfectedInPast, chanceForHouseholdToBeInfectedInPast }