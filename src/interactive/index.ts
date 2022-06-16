import i from 'inquirer'

import add from '../add'
import { fetchModules } from '../list'

export default async (args: string[]) => {
    const { selected } = await i.prompt({
        name: 'selected',
        message: 'Select modules to install',
        type: 'checkbox',
        choices: await fetchModules()
    })

    return add(selected)
}
