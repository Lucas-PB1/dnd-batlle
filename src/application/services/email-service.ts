export class EmailService {
  async sendRoleNotification(
    email: string,
    displayName: string,
    roles: string[],
  ): Promise<void> {
    const roleLabels = roles
      .map((role) => {
        if (role === 'admin') return 'Administrador';
        if (role === 'judge') return 'Juiz';
        return 'Jogador';
      })
      .join(', ');

    await this.send(
      email,
      'Arena Duel — papéis atualizados',
      `<p>Olá ${displayName},</p><p>Seus papéis no Arena Duel: <strong>${roleLabels}</strong>.</p>`,
    );
  }

  async sendDuelResultNotification(
    email: string,
    displayName: string,
    characterName: string,
    summary: string,
  ): Promise<void> {
    await this.send(
      email,
      'Arena Duel — resultado do duelo',
      `<p>Olá ${displayName},</p><p>Seu personagem <strong>${characterName}</strong>: ${summary}</p>`,
    );
  }

  async sendDuelInviteNotification(
    email: string,
    displayName: string,
    duelUrl: string,
  ): Promise<void> {
    await this.send(
      email,
      'Arena Duel — convite de duelo',
      `<p>Olá ${displayName},</p><p>Um duelo está aberto para inscrição: <a href="${duelUrl}">${duelUrl}</a></p>`,
    );
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM ?? 'Arena Duel <onboarding@resend.dev>';

    if (!apiKey) {
      console.info('[email:stub]', { to, subject });
      return;
    }

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
  }
}
