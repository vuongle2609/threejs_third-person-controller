interface PropsType {
  initialHeal: number;
}

export class Combat {
  heal = 0;

  constructor({ initialHeal }: PropsType) {
    this.heal = initialHeal;
  }

  receiveDamage(damageNumber: number) {
    this.heal -= damageNumber;
    if (this.heal < 0) this.heal = 0;
  }
}
