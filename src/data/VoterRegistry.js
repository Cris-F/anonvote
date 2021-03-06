import {bn128} from 'snarkyjs-crypto'

const merkleDepth = 8

export default class VoterRegistry {
  constructor() {
    this.registrationOpen = true
    this.memberCommitments = new Set()
    this.merkleTree = null
  }

  register(commitment) {
    if(!this.registrationOpen)
      throw new Error('registration is closed')

    if(this.memberCommitments.has(commitment))
      throw new Error('already registered')

    this.memberCommitments.add(commitment.toString())
  }

  closeRegistration() {
    if(!this.registrationOpen)
      throw new Error('registration already closed')

    this.registrationOpen = false

    const numberOfLeaves = Math.pow(2, merkleDepth)
    if(this.memberCommitments.size > numberOfLeaves)
      throw new Error('too many member commitments')
    const leafPadding = numberOfLeaves - this.memberCommitments.size

    this.merkleTree = new bn128.MerkleTree.ofArray(
      // our merkle tree leaves are already hashed, so the hash function
      // is an identity
      (commitment) => commitment,
      // empty leaves will be filled with the hash of 0
      bn128.Field.zero,
      // the leaves of our merkle tree are the commitments to the voter entries
      [...this.memberCommitments].map((c) => bn128.Field.ofString(c)).concat(Array.apply(null, Array(leafPadding)).map(() => bn128.Field.zero))
    )
  }

  merkleTreeRoot() {
    if(this.registrationOpen)
      throw new Error('registration is still open')

    return bn128.MerkleTree.root(this.merkleTree)
  }

  proveMembership(commitment) {
    const index = [...this.memberCommitments].indexOf(commitment.toString())
    if(index < 0)
      return null
    return bn128.MerkleTree.MembershipProof.create(this.merkleTree, index)
  }
}
