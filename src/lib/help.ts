import { Help } from '@oclif/core';
import pc from 'picocolors';

const ETHOS_BANNER = `
${pc.cyan('███████╗████████╗██╗  ██╗ ██████╗ ███████╗')}
${pc.cyan('██╔════╝╚══██╔══╝██║  ██║██╔═══██╗██╔════╝')}
${pc.cyan('█████╗     ██║   ███████║██║   ██║███████╗')}
${pc.cyan('██╔══╝     ██║   ██╔══██║██║   ██║╚════██║')}
${pc.cyan('███████╗   ██║   ██║  ██║╚██████╔╝███████║')}
${pc.cyan('╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝')}
`;

export default class EthosHelp extends Help {
  async showRootHelp(): Promise<void> {
    console.log(ETHOS_BANNER);
    console.log(pc.dim('  The reputation layer for the internet\n'));
    await super.showRootHelp();
  }
}
