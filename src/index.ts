#!/usr/bin/env node
import degit from 'degit'
import chalk from 'chalk'

import add from './add'
import list from './list'
import interactive from './interactive'
import help from './help/help'

const {
    argv: [_, __, command, ...args]
} = process

const main = async () => {
    switch (command) {
        case 'a':
        case 'add':
            await add(args)
            break

        case 'i':
        case 'interactive':
            await interactive(args)
            break

        case 'l':
        case 'list':
            await list(args)
            break

        case 'h':
        case 'help':
        case undefined:
            help()
            break

        default:
            console.log(`${chalk.cyan(command)} command not found`)
            break
    }
}

main()
