from rich.console import Console
from rich.table import Table
from rich.live import Live
from rich.panel import Panel
from rich.layout import Layout
from rich.text import Text
from rich.progress import BarColumn, Progress
import datetime

console = Console()

class MaxGDashboard:
    def __init__(self):
        self.layout = Layout()
        self.setup_layout()

    def setup_layout(self):
        self.layout.split(
            Layout(name="header", size=3),
            Layout(name="body"),
            Layout(name="footer", size=3)
        )
        self.layout["body"].split_row(
            Layout(name="metrics", ratio=2),
            Layout(name="signals", ratio=3)
        )

    def generate_header(self, spot: float, change: float):
        color = "green" if change >= 0 else "red"
        header_text = Text(f"MaxG v3.1 | Execution-Calibrated Doctrine | {datetime.datetime.now().strftime('%H:%M:%S')}", style="bold cyan")
        spot_text = Text(f"SPOT: {spot:.2f} ({change:+.2f}%)", style=f"bold {color}")
        return Panel(Layout(name="h", split_row=[Layout(Text(header_text)), Layout(Text(spot_text), align="right")]), style="blue")

    def generate_metrics_table(self, data: dict):
        table = Table(title="Structural Constraint Metrics", expand=True)
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="magenta")
        table.add_row("Adjusted GEX", f"{data.get('gex_adj', 0):,.2f}")
        table.add_row("V_norm", f"{data.get('v_norm', 0):.2f}σ")
        table.add_row("Regime", data.get('regime', 'STABLE'))
        table.add_row("Flip Zone", data.get('gfz', 'N/A'))
        table.add_row("Persistence", f"{data.get('persistence', 0)}/6")
        return Panel(table, title="[bold white]Analytics[/bold white]", border_style="cyan")

    def generate_signals_panel(self, signals: list):
        table = Table(title="High-Fidelity Signal Stream", expand=True)
        table.add_column("Time", style="dim")
        table.add_column("Strike", style="bold")
        table.add_column("Delta", style="yellow")
        table.add_column("Trigger", style="green")
        table.add_column("Conf %", style="bold magenta")

        for sig in signals[-10:]:
            table.add_row(sig['time'], sig['strike'], f"{sig['delta']:.2f}", sig['trigger'], f"{sig['conf']}%")
        
        return Panel(table, title="[bold green]SENTINEL STREAM[/bold green]", border_style="green")

    def update(self, spot_data, metrics_data, signals):
        self.layout["header"].update(self.generate_header(spot_data['spot'], spot_data['change']))
        self.layout["metrics"].update(self.generate_metrics_table(metrics_data))
        self.layout["signals"].update(self.generate_signals_panel(signals))
        return self.layout
