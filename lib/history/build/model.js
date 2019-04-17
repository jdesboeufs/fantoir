const {uniq} = require('lodash')

function initCommune(commune) {
  return {...commune, voies: new Set()}
}

function initVoie(voie) {
  return {
    id: voie.hid,
    dateAjout: voie.dateAjout,
    libelle: [],
    typeVoie: voie.typeVoie,
    codeCommune: voie.codeCommune,
    codeFantoir: voie.codeRivoli
  }
}

class Model {
  constructor() {
    this._communesIndex = new Map()
    this._voiesIndex = new Map()
    this._cancelledCommunes = new Set()
    this._handledCancelledCommunes = new Set()
    this._addedVoies = new Set()
  }

  upsertCommune(commune) {
    const codeCommune = commune.id

    if (commune.dateAnnulation && !this._handledCancelledCommunes.has(codeCommune)) {
      this.addCancelledCommune(codeCommune)
    }

    if (this._communesIndex.has(codeCommune)) {
      return this._communesIndex.get(codeCommune)
    }

    const newCommune = initCommune(commune)
    this._communesIndex.set(codeCommune, newCommune)
    return newCommune
  }

  upsertVoie(voie, commune) {
    const id = voie.hid

    if (this._voiesIndex.has(id)) {
      return this._voiesIndex.get(id)
    }

    const newVoie = initVoie(voie)
    this._voiesIndex.set(id, newVoie)
    this._addedVoies.add(newVoie)
    this.upsertCommune(commune).voies.add(newVoie)
    return newVoie
  }

  getVoies(codeCommune) {
    return [...this._communesIndex.get(codeCommune).voies]
  }

  getLibelleVoie(idVoie) {
    if (!this._voiesIndex.has(idVoie)) {
      throw new Error('Voie inconnue')
    }

    const voie = this._voiesIndex.get(idVoie)
    if (!voie.predecesseur) {
      return uniq(voie.libelle)
    }

    return uniq(this.getLibelleVoie(voie.predecesseur.id).concat(voie.libelle))
  }

  hasCommune(codeCommune) {
    return this._communesIndex.has(codeCommune)
  }

  getCommunes() {
    return [...this._communesIndex.values()]
  }

  addCancelledCommune(codeCommune) {
    this._cancelledCommunes.add(codeCommune)
  }

  getCancelledCommunes() {
    return [...this._cancelledCommunes]
  }

  cleanup() {
    this._addedVoies.forEach(v => {
      if (v.predecesseur === undefined) {
        v.predecesseur = false
      }
    })
    this._addedVoies.clear()

    this.getCancelledCommunes().forEach(c => {
      this._handledCancelledCommunes.add(c)
    })
    this._cancelledCommunes.clear()
  }
}

module.exports = Model