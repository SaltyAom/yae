import chalk from 'chalk'

const yae = chalk.cyan.bold("yae")

const manual = `
${yae} - Package manager for SaltyAom stack.

Usage: ${yae} [command] [...args] [...flags]

Commands:
    a, add          Add new modules from repo
    i, interactive  Using interactive CLI for adding new modules
    l, list         List modules from repo
    h, help         Display help informations / manual
`

export default () => {
    console.log(manual)
}
