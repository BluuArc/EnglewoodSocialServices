// converts data from mapTypeNames.json and allDataBlocks.geojson
// to censusDataNames.json and censusDataBlocks.geojson

const fs = require('fs');

const allDataBlocks = JSON.parse(fs.readFileSync('allDataBlocks.geojson', 'utf8'));
const mapTypeNames = JSON.parse(fs.readFileSync('mapTypeNames.json'));

const ageMapping = {
  "Under 5 years": "Under 5 years",
  "5 to 9 years": "5 to 14 years",
  "10 to 14 years": "5 to 14 years",
  "15 to 17 years": "15 to 19 years",
  "18 and 19 years": "15 to 19 years",
  "20 years": "20 to 29 years",
  "21 years": "20 to 29 years",
  "22 to 24 years": "20 to 29 years",
  "25 to 29 years": "20 to 29 years",
  "30 to 34 years": "30 to 44 years",
  "35 to 39 years": "30 to 44 years",
  "40 to 44 years": "30 to 44 years",
  "45 to 49 years": "45 to 64 years",
  "50 to 54 years": "45 to 64 years",
  "55 to 59 years": "45 to 64 years",
  "60 and 61 years": "45 to 64 years",
  "62 to 64 years": "45 to 64 years",
  "65 and 66 years": "65 years and over",
  "67 to 69 years": "65 years and over",
  "70 to 74 years": "65 years and over",
  "75 to 79 years": "65 years and over",
  "80 to 84 years": "65 years and over",
  "85 years and over": "65 years and over",
};

function mapTypeNameToCensusDataName(input = { mainType: "", subType: ""}) {
  let { mainType, subType } = input;


  if(mainType === "SEX_BY_AGE") {
    if (subType === "Total:") {
      mainType = `${mainType}_(OVERALL)`;
    } else if(subType.indexOf("Male") > -1) {
      mainType = `${mainType}_(MALE)`;
      
      if(subType.indexOf("-") > -1) {
        const [gender, age] = subType.split(": - ");
        subType = ageMapping[age];
      }else { //is a total value
        subType = "Total";
      }
    } else if (subType.indexOf("Female") > -1) {
      mainType = `${mainType}_(FEMALE)`;

      if (subType.indexOf("-") > -1) {
        const [gender, age] = subType.split(": - ");
        subType = ageMapping[age];
      } else { //is a total value
        subType = "Total";
      }
    } else {
      console.error("Unknown subtype", subType);
    }
  }

  if (subType.trim() === "Total:" || subType === "Total races tallied:") {
    subType = "Total";
  }

  return { mainType, subType };
}

function createEmptyDataBlock() {
  const block = {};

  for(const mainType in mapTypeNames){
    for(const subType of mapTypeNames[mainType]){
      const result = mapTypeNameToCensusDataName({ mainType, subType });
      const [newMain, newSub] = [result.mainType, result.subType];
      if (!block[newMain]) {
        block[newMain] = {};
      }

      block[newMain][newSub] = 0;
    }
  }

  for(const age in ageMapping) {
    block["SEX_BY_AGE_(OVERALL)"][ageMapping[age]] = 0;
  }
  
  return block;
}

function showTranslations() {
  const block = createEmptyDataBlock();
  console.log(block);
}

function transformBlock(block) {
  let newBlock = {};

  // copy all other feature properties
  for (const property in block) {
    if (property !== "properties") {
      newBlock[property] = block[property];
    }
  }

  // copy all block data except fro census data
  newBlock.properties = {};
  for (const property in block.properties) {
    if (property !== "census") {
      newBlock.properties[property] = block.properties[property];
    }
  }

  // transform census data
  const oldData = block.properties.census;
  let newData = createEmptyDataBlock();

  for (const mainType in oldData) {
    for (const subType in oldData[mainType]) {
      const transformation = mapTypeNameToCensusDataName({ mainType, subType });
      const [newMain, newSub] = [transformation.mainType, transformation.subType];

      newData[newMain][newSub] += oldData[mainType][subType];
    }
  }

  // add overall fields
  const ageFields = Object.keys(newData["SEX_BY_AGE_(OVERALL)"]);
  for(const age of ageFields) {
    newData["SEX_BY_AGE_(OVERALL)"][age] += newData["SEX_BY_AGE_(MALE)"][age] + newData["SEX_BY_AGE_(FEMALE)"][age];
  }

  newData["SEX_BY_AGE_(OVERALL)"].Total = 0;
  for(const age of ageFields) {
    newData["SEX_BY_AGE_(OVERALL)"].Total += newData["SEX_BY_AGE_(OVERALL)"][age];
  }

  newBlock.properties.census = newData;

  return newBlock;
}

function transformAllBlocks() {
  const censusDataBlocks = {
    type: "FeatureCollection",
    features: []
  };

  for(const block of allDataBlocks.features) {
    censusDataBlocks.features.push(transformBlock(block));
  }

  fs.writeFileSync('censusDataBlocks.geojson', JSON.stringify(censusDataBlocks), 'utf8');
  console.log("Done transforming census data");
}

function saveCensusDataNames() {
  let names = {};
  const block = createEmptyDataBlock();

  for(const mainType in block){
    names[mainType] = Object.keys(block[mainType]);
  }
  
  fs.writeFileSync('censusDataNames.json', JSON.stringify(names), 'utf8');
  console.log("Done saving CensusDataNames");
}

saveCensusDataNames();
transformAllBlocks();
