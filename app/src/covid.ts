import covidInfections from "./covid_infections.json";
import covidPop from "./covid_populations.json";


let statePopCache: Map<string, number> = new Map<string, number>();

let stateList: string[] = null;
function listStates(): string[] {
  if (!stateList) {
    stateList = Array.from(new Set(covidPop.map(item => item.state)));
  }

  return stateList;
}

function listCounties(state: string) {
  return covidPop.filter(it => it.state == state).map(it => it.county);
}

function getPop(state: string, county: string = null): number {
  if (!state && county) throw 'must supply state with county';

  if (!state) return covidPop.reduce((acum, next) => acum + next.pop, 0);

  if (county)
    return covidPop.filter(item => item.state == state && item.county == county)[0].pop;

  if (!statePopCache[state]) {
    let result = covidPop
      .filter(pop => pop.state == state)
      .reduce((acum, next) => acum + next.pop, 0);

    statePopCache[state] = result;
  }

  return statePopCache[state];
}

let stateInfectionCache: Map<string, number> = new Map<string, number>();
let overallInfectionAverage: number = null;
function getInfectionCount(state: string = null, county: string = null): number {
  if (!state && county) throw 'must supply state with county';

  if (!state && !county) {
    if (!overallInfectionAverage) {
      overallInfectionAverage = covidInfections.reduce((acum, next) => acum + next.avgInfected, 0) / covidInfections.length;
    }
    return overallInfectionAverage;
  }

  if (county)
    return covidInfections.filter(item => item.state == state && item.county == county)[0].avgInfected;

  if (!stateInfectionCache[state]) {
    let stateEntries = covidInfections
      .filter(item => item.state == state);
    let result = stateEntries
      .reduce((acum, next) => acum + next.avgInfected, 0) / stateEntries.length;

    stateInfectionCache[state] = result;
  }

  return stateInfectionCache[state];
}

function getInfectionRate(state: string = null, county: string = null) {
  return getInfectionCount(state, county) / getPop(state, county);
}

function chanceToBeInfectedInPast(numDays: number, state: string = null, county: string = null) {
  return getInfectionRate(state, county) * numDays;
}

export { listStates, listCounties, getPop, getInfectionCount, getInfectionRate, chanceToBeInfectedInPast }