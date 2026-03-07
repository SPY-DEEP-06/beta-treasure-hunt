export const eventLocations = [
  { id: 1, clue: "The red warrior that fights flames silently waits near pipes.", label: "Fire extinguisher inside hose/outlet first floor" },
  { id: 2, clue: "Where electrons dance and circuits connect on the first level.", label: "Lab 111 first floor" },
  { id: 3, clue: "Through this glass, you might see the 101st room's secrets.", label: "Window near lab 101 first floor" },
  { id: 4, clue: "News and notices hang here near the ground floor start.", label: "Notice board near 001 ground floor" },
  { id: 5, clue: "Steps leading down to the deepest exit.", label: "Staircase near exit basement" },
  { id: 6, clue: "Ancient roots near where the coffee brews.", label: "Banyan tree near cafe outside" },
  { id: 7, clue: "Behind the slumbering metal beast that powers the campus.", label: "Behind corner of generator outside" },
  { id: 8, clue: "A shutter shielding bolts of energy near the outside exit.", label: "Power supply shutter near exit ground floor outside" },
  { id: 9, clue: "Wait, didn't you already go down? Another path awaits.", label: "Staircase to exit basement" },
  { id: 10, clue: "Look up where the water sleeps, below the red pipes.", label: "Behind fire pump room ceiling or below hydrant pipes" },
  { id: 11, clue: "Where 208 mice rest their tails on the second floor.", label: "Extendible mouse placer in keyboard holder of lab 208 second floor" },
  { id: 12, clue: "A resting place in the open air, third floor IT.", label: "Behind group of benches in balcony lab 304 IT department third floor" },
  { id: 13, clue: "Where speakers stand tall, their secrets hidden below.", label: "Host podium of seminar hall third floor or first floor" },
  { id: 14, clue: "Where the staff ascends, a wooden guard stands.", label: "Behind cabinet near staff lift" },
  { id: 15, clue: "Underneath the steps where the masters rule.", label: "Below staircase leading to admin office" },
  { id: 16, clue: "Read all about it where the books reside.", label: "Notice board near library ground floor" },
  { id: 17, clue: "Look through the glass of 301, or perhaps where one freshens up.", label: "Classroom 301 window or washroom window third floor" },
  { id: 18, clue: "Behind a hidden wall near room 303.", label: "In front of 303 partition behind side wall third floor" },
  { id: 19, clue: "Sandwiched between two giant signs on the third level.", label: "Between two banners on floor 3" },
  { id: 20, clue: "A red box hiding near red pipes, but much higher than before.", label: "Fire extinguisher box behind red pipes third floor" },
  { id: 21, clue: "Where the thirsty gather to quench their dry throats.", label: "Cup holder of water cooler ground floor" },
  { id: 22, clue: "Behind the grand announcement on the first level.", label: "Behind banner on first floor" },
  { id: 23, clue: "Follow the earth until it leads to a small dwelling.", label: "Cluster of mud outside (leading to small house)" },
  // FINAL LOCATIONS
  { id: 24, clue: "A tiny abode near the watcher's gate.", label: "Small house outside near security cabin" },
  { id: 25, clue: "Beneath the bricks or hiding in paint, inside the tiny dwelling.", label: "Inside small house below bricks or paint box" }
];

export const initialRiddles = [
  { question: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", answer: "echo" },
  { question: "I go in hard, come out soft. You blow me hard. What am I?", answer: "gum" } // Let's use standard ones
];

export const getClueForLocation = (locationId) => {
  return eventLocations.find(loc => loc.id === locationId);
};
